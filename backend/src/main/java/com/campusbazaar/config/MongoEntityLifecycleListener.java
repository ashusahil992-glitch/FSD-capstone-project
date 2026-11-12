package com.campusbazaar.config;

import com.campusbazaar.entity.BaseEntity;
import com.campusbazaar.entity.DatabaseSequence;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoOperations;
import org.springframework.data.mongodb.core.mapping.event.AbstractMongoEventListener;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertEvent;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Component;

@Component
public class MongoEntityLifecycleListener extends AbstractMongoEventListener<BaseEntity> {

    private final MongoOperations mongoOperations;

    public MongoEntityLifecycleListener(MongoOperations mongoOperations) {
        this.mongoOperations = mongoOperations;
    }

    @Override
    public void onBeforeConvert(BeforeConvertEvent<BaseEntity> event) {
        BaseEntity entity = event.getSource();
        if (entity.getId() == null) {
            String seqName = event.getCollectionName() != null
                    ? event.getCollectionName()
                    : entity.getClass().getSimpleName().toLowerCase();
            entity.prepareForSave(nextId(seqName));
        } else {
            entity.prepareForSave(entity.getId());
        }
        entity.syncForeignKeys();
    }

    public long nextId(String seqName) {
        DatabaseSequence counter = mongoOperations.findAndModify(
                Query.query(Criteria.where("_id").is(seqName)),
                new Update().inc("seq", 1),
                FindAndModifyOptions.options().returnNew(true).upsert(true),
                DatabaseSequence.class);
        return counter != null ? counter.getSeq() : 1L;
    }
}
